import source from '../../usecase.theme.json';
import type { ThemeSettings } from '@usecase-ui/svelte';
const { $schema: _schema, ...settings } = source;
export const theme = settings as ThemeSettings;
