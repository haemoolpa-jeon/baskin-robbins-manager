// Public entry for @br/shared.
//
// Apps consume shared code through the `@shared/*` path alias (configured in
// each app's tsconfig + vite.config), so deep imports like
// `@shared/components/Modal` are the normal usage. This barrel exists only so
// the workspace package has a resolvable entry point.
export {}
