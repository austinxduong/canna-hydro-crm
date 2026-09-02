export default {
    test : {
        env : {
            RATE_LIMIT_MAX: '15',
            RATE_LIMIT_WINDOW_MS: '1000',
            SANITY_CHECK: 'vitest-config-is-working'
        }
    }
}