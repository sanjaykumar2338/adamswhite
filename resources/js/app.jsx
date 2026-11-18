import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'SHIFTRIX';

createInertiaApp({
    title: (title) => title ? `${title} – ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        document.documentElement.lang = props.initialPage.props.locale || 'en';

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
