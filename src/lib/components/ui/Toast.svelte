<script>
	export let message;
	export let type = 'success';
</script>

<div class="flex items-center">
	<span
		class={`mr-4 flex h-5 w-5 items-center justify-center rounded-full drop-shadow-lg 
		${type === 'warning' ? 'bg-warning' : type === 'info' ? 'bg-primary' : type === 'error' ? 'bg-error' : 'bg-success'}`}
	>
		{#if type === 'warning'}
			<svg
				width="28"
				height="28"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g filter="url(#filter0_d_1693_3327)">
					<rect x="4" y="4" width="20" height="20" rx="10" fill="#F7CF46" />
				</g>
				<path
					d="M12.0991 9.09748C12.944 7.63417 15.056 7.63418 15.9009 9.09748L19.7027 15.6823C20.5475 17.1456 19.4914 18.9748 17.8018 18.9748H10.1982C8.50855 18.9748 7.4525 17.1456 8.29734 15.6823L12.0991 9.09748Z"
					fill="white"
				/>
				<path
					d="M12.0991 9.09748C12.944 7.63417 15.056 7.63418 15.9009 9.09748L19.7027 15.6823C20.5475 17.1456 19.4914 18.9748 17.8018 18.9748H10.1982C8.50855 18.9748 7.4525 17.1456 8.29734 15.6823L12.0991 9.09748Z"
					fill="white"
				/>
				<path
					d="M13 11C13 10.4477 13.4477 10 14 10C14.5523 10 15 10.4477 15 11V14C15 14.5523 14.5523 15 14 15C13.4477 15 13 14.5523 13 14V11Z"
					fill="#F7CF46"
				/>
				<path
					d="M13 17C13 16.4477 13.4477 16 14 16C14.5523 16 15 16.4477 15 17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17Z"
					fill="#F7CF46"
				/>
				<defs>
					<filter
						id="filter0_d_1693_3327"
						x="0"
						y="0"
						width="28"
						height="28"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="2" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix
							type="matrix"
							values="0 0 0 0 0.968627 0 0 0 0 0.811765 0 0 0 0 0.27451 0 0 0 0.4 0"
						/>
						<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1693_3327" />
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_1693_3327"
							result="shape"
						/>
					</filter>
				</defs>
			</svg>
		{:else if type === 'info'}
			<svg
				width="28"
				height="28"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g filter="url(#filter0_d_1693_3273)">
					<circle cx="14" cy="14" r="10" fill="#237BF8" />
				</g>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M14 19C13.4477 19 13 18.5523 13 18V13C13 12.4477 13.4477 12 14 12C14.5523 12 15 12.4477 15 13V18C15 18.5523 14.5523 19 14 19Z"
					fill="white"
				/>
				<path
					d="M14 9C13.4477 9 13 9.44772 13 10C13 10.5523 13.4477 11 14 11C14.5523 11 15 10.5523 15 10C15 9.44772 14.5523 9 14 9Z"
					fill="white"
				/>
				<defs>
					<filter
						id="filter0_d_1693_3273"
						x="0"
						y="0"
						width="28"
						height="28"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="2" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix
							type="matrix"
							values="0 0 0 0 0.136026 0 0 0 0 0.483572 0 0 0 0 0.971615 0 0 0 0.4 0"
						/>
						<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1693_3273" />
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_1693_3273"
							result="shape"
						/>
					</filter>
				</defs>
			</svg>
		{:else if type === 'error'}
			<svg
				width="28"
				height="28"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g filter="url(#filter0_d_1693_3272)">
					<rect x="4" y="4" width="20" height="20" rx="10" fill="#F82349" />
				</g>
				<path
					d="M10.0716 11.6426C9.63765 11.2087 9.63765 10.5052 10.0716 10.0713C10.5055 9.63734 11.209 9.63734 11.6429 10.0713L17.9283 16.3567C18.3622 16.7906 18.3622 17.4941 17.9283 17.928C17.4944 18.3619 16.7909 18.3619 16.357 17.928L10.0716 11.6426Z"
					fill="white"
				/>
				<path
					d="M11.6431 17.9287C11.2092 18.3626 10.5057 18.3626 10.0717 17.9287C9.63783 17.4948 9.63783 16.7912 10.0717 16.3573L16.3571 10.0719C16.7911 9.63802 17.4946 9.63802 17.9285 10.0719C18.3624 10.5059 18.3624 11.2094 17.9285 11.6433L11.6431 17.9287Z"
					fill="white"
				/>
				<defs>
					<filter
						id="filter0_d_1693_3272"
						x="0"
						y="0"
						width="28"
						height="28"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset />
						<feGaussianBlur stdDeviation="2" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix
							type="matrix"
							values="0 0 0 0 0.972549 0 0 0 0 0.137255 0 0 0 0 0.286275 0 0 0 0.4 0"
						/>
						<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1693_3272" />
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_1693_3272"
							result="shape"
						/>
					</filter>
				</defs>
			</svg>
		{:else if type === 'success'}
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="2.5"
					y="2.5"
					width="15"
					height="15"
					rx="7.5"
					fill="#23CF69"
					stroke="#23CF69"
					stroke-width="1.66667"
				/>
				<path
					d="M13.2913 7.5L9.35254 12.8711L6.66699 9.82747"
					stroke="#F6F8F9"
					stroke-width="1.66667"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</span>
	<p>{@html message}</p>
</div>
