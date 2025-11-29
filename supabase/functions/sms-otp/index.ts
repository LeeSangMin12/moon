import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { action, phone, code } = await req.json();

		if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
			throw new Error("Twilio credentials not configured");
		}

		const credentials = `${TWILIO_ACCOUNT_SID.trim()}:${TWILIO_AUTH_TOKEN.trim()}`;
		const encoder = new TextEncoder();
		const encoded = encoder.encode(credentials);
		const base64 = btoa(String.fromCharCode(...encoded));
		const authHeader = `Basic ${base64}`;

		if (action === "send") {
			const response = await fetch(
				`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: authHeader,
					},
					body: new URLSearchParams({
						To: phone,
						Channel: "sms",
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				return new Response(
					JSON.stringify({ success: false, error: data.message || "Failed to send OTP" }),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			}

			return new Response(
				JSON.stringify({ success: true, status: data.status }),
				{
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		} else if (action === "verify") {
			const response = await fetch(
				`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: authHeader,
					},
					body: new URLSearchParams({
						To: phone,
						Code: code,
					}),
				}
			);

			const data = await response.json();

			if (data.status === "approved") {
				return new Response(
					JSON.stringify({ success: true, status: "approved" }),
					{
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			} else {
				return new Response(
					JSON.stringify({ success: false, error: "Invalid or expired code" }),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			}
		}

		return new Response(
			JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'" }),
			{
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: error.message }),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	}
});
