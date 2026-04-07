// vite.config.ts — library-mode build for ESM + CJS + types
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		react(),
		dts({ rollupTypes: true }),
	],
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'react/jsx-runtime'],
			output: {
				globals: { react: 'React', 'react-dom': 'ReactDOM' },
			},
		},
	},
})
