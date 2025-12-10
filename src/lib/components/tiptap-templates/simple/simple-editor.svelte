<script>
	import { Editor } from '@tiptap/core';
	import { Highlight } from '@tiptap/extension-highlight';
	import { TextAlign } from '@tiptap/extension-text-align';
	import { Typography } from '@tiptap/extension-typography';
	import BulletList from '@tiptap/extension-bullet-list';
	import StarterKit from '@tiptap/starter-kit';
	import ImageResize from 'tiptap-extension-resize-image';
	import { HardBreak } from '@tiptap/extension-hard-break';
	import Placeholder from '@tiptap/extension-placeholder';
	import { onDestroy, onMount } from 'svelte';

	let editorElement;
	let editor;

	export let content = '';
	export let placeholder = '내용을 입력하세요...';

	onMount(() => {
		const BulletListNoInputRules = BulletList.extend({
			// Disable the automatic "- " to bullet list conversion so the dash stays visible
			addInputRules: () => [],
		});

		editor = new Editor({
			element: editorElement,
			extensions: [
				StarterKit.configure({
					hardBreak: true, // HardBreak 활성화
					bulletList: false, // Replace with custom bullet list to disable input rule
				}),
				BulletListNoInputRules,
				Highlight.configure({
					multicolor: true,
				}),
				Typography,
				TextAlign.configure({
					types: ['heading', 'paragraph'],
				}),
				ImageResize.configure({
					inline: false,
					allowBase64: true,
					HTMLAttributes: {
						class: 'rounded-lg',
					},
				}),
				Placeholder.configure({
					placeholder: placeholder,
				}),
			],
			content: content,
			editorProps: {
				attributes: {
					class:
						'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
				},
			},
			// Disable all on-type input rules so characters like "- " stay literal
			enableInputRules: false,
			onTransaction: () => {
				editor = editor;
			},
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	function toggleBold() {
		editor.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor.chain().focus().toggleItalic().run();
	}

	function toggleStrike() {
		editor.chain().focus().toggleStrike().run();
	}

	function toggleHeading(level) {
		editor.chain().focus().toggleHeading({ level }).run();
	}

	function toggleBulletList() {
		editor.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor.chain().focus().toggleOrderedList().run();
	}

	function toggleBlockquote() {
		editor.chain().focus().toggleBlockquote().run();
	}

	function setTextAlign(alignment) {
		editor.chain().focus().setTextAlign(alignment).run();
	}

	function undo() {
		editor.chain().focus().undo().run();
	}

	function redo() {
		editor.chain().focus().redo().run();
	}

	function addImage() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = (event) => {
			const file = event.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const url = e.target.result;
					editor.chain().focus().setImage({ src: url }).run();
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	}

	$: if (editor && content !== editor.getHTML()) {
		editor.commands.setContent(content);
	}

	$: if (editor) {
		content = editor.getHTML();
	}
</script>

<div
	class="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm"
>
	<!-- Toolbar -->
	<div class="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-3">
		<!-- Text formatting -->
		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 text-sm font-bold transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('bold')}
			class:border-blue-400={editor?.isActive('bold')}
			onclick={toggleBold}
			title="Bold"
		>
			B
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 text-sm italic transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('italic')}
			class:border-blue-400={editor?.isActive('italic')}
			onclick={toggleItalic}
			title="Italic"
		>
			I
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 text-sm line-through transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('strike')}
			class:border-blue-400={editor?.isActive('strike')}
			onclick={toggleStrike}
			title="Strikethrough"
		>
			S
		</button>

		<div class="h-[36px] w-px bg-gray-300"></div>

		<!-- Headings -->
		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('heading', { level: 1 })}
			class:border-blue-400={editor?.isActive('heading', { level: 1 })}
			onclick={() => toggleHeading(1)}
			title="Heading 1"
		>
			H1
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('heading', { level: 2 })}
			class:border-blue-400={editor?.isActive('heading', { level: 2 })}
			onclick={() => toggleHeading(2)}
			title="Heading 2"
		>
			H2
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive('heading', { level: 3 })}
			class:border-blue-400={editor?.isActive('heading', { level: 3 })}
			onclick={() => toggleHeading(3)}
			title="Heading 3"
		>
			H3
		</button>

		<div class="h-[36px] w-px bg-gray-300"></div>

		<!-- Alignment -->
		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive({ textAlign: 'left' })}
			class:border-blue-400={editor?.isActive({ textAlign: 'left' })}
			onclick={() => setTextAlign('left')}
			title="Align Left"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-gray-700"
			>
				<line x1="17" y1="10" x2="3" y2="10"></line>
				<line x1="21" y1="6" x2="3" y2="6"></line>
				<line x1="21" y1="14" x2="3" y2="14"></line>
				<line x1="17" y1="18" x2="3" y2="18"></line>
			</svg>
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive({ textAlign: 'center' })}
			class:border-blue-400={editor?.isActive({ textAlign: 'center' })}
			onclick={() => setTextAlign('center')}
			title="Align Center"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-gray-700"
			>
				<line x1="18" y1="10" x2="6" y2="10"></line>
				<line x1="21" y1="6" x2="3" y2="6"></line>
				<line x1="21" y1="14" x2="3" y2="14"></line>
				<line x1="18" y1="18" x2="6" y2="18"></line>
			</svg>
		</button>

		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 transition-colors hover:bg-gray-100"
			class:bg-blue-100={editor?.isActive({ textAlign: 'right' })}
			class:border-blue-400={editor?.isActive({ textAlign: 'right' })}
			onclick={() => setTextAlign('right')}
			title="Align Right"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-gray-700"
			>
				<line x1="21" y1="10" x2="7" y2="10"></line>
				<line x1="21" y1="6" x2="3" y2="6"></line>
				<line x1="21" y1="14" x2="3" y2="14"></line>
				<line x1="21" y1="18" x2="7" y2="18"></line>
			</svg>
		</button>

		<div class="h-[36px] w-px bg-gray-300"></div>

		<!-- Image -->
		<button
			class="flex h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 p-2 transition-colors hover:bg-gray-100"
			onclick={addImage}
			title="Add Image"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-gray-700"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
				<circle cx="9" cy="9" r="2"></circle>
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
			</svg>
		</button>
	</div>

	<!-- Editor -->
	<div
		bind:this={editorElement}
		class="min-h-[300px] bg-white"
		style="border: none; outline: none;"
	></div>
</div>

<style>
	:global(.ProseMirror) {
		outline: none !important;
		border: none !important;
		min-height: 300px;
		padding: 1rem;
	}

	:global(.ProseMirror h1) {
		font-size: 2rem !important;
		font-weight: bold !important;
		margin: 1rem 0 0.5rem 0 !important;
	}

	:global(.ProseMirror h2) {
		font-size: 1.5rem !important;
		font-weight: bold !important;
		margin: 0.8rem 0 0.4rem 0 !important;
	}

	:global(.ProseMirror h3) {
		font-size: 1.25rem !important;
		font-weight: bold !important;
		margin: 0.6rem 0 0.3rem 0 !important;
	}

	:global(.ProseMirror p) {
		margin: 0.5rem 0 !important;
	}

	:global(.ProseMirror ul, .ProseMirror ol) {
		padding-left: 1.5rem !important;
		margin: 0.5rem 0 !important;
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid #e5e7eb !important;
		padding-left: 1rem !important;
		margin: 1rem 0 !important;
		font-style: italic !important;
		color: #6b7280 !important;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
		white-space: pre-line;
	}

	/* Image resize styles */
	:global(.ProseMirror img) {
		max-width: 100% !important;
		height: auto !important;
		display: block !important;
		margin: 1rem auto !important;
		border-radius: 0.5rem !important;
	}

	:global(.image-resizer) {
		display: inline-block !important;
		position: relative !important;
		max-width: 100% !important;
	}

	:global(.image-resizer img) {
		width: 100% !important;
		height: auto !important;
		display: block !important;
	}

	:global(.image-resizer__handle) {
		position: absolute !important;
		background: #3b82f6 !important;
		border: 2px solid white !important;
		border-radius: 50% !important;
		width: 12px !important;
		height: 12px !important;
		cursor: nw-resize !important;
		z-index: 10 !important;
	}

	:global(.image-resizer__handle--ne) {
		top: -6px !important;
		right: -6px !important;
		cursor: ne-resize !important;
	}

	:global(.image-resizer__handle--nw) {
		top: -6px !important;
		left: -6px !important;
		cursor: nw-resize !important;
	}

	:global(.image-resizer__handle--se) {
		bottom: -6px !important;
		right: -6px !important;
		cursor: se-resize !important;
	}

	:global(.image-resizer__handle--sw) {
		bottom: -6px !important;
		left: -6px !important;
		cursor: sw-resize !important;
	}
</style>
