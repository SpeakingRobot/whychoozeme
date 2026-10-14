import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import AdminConsole from './AdminConsole';
import { isAdminRoute } from './adminRoute';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/comic-neue/700.css';
import './web.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(isAdminRoute ? <AdminConsole /> : <App />);
