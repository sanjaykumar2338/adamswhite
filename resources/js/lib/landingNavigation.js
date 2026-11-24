export function landingNavigation(user) {
    if (!user) {
        return { routeName: 'login', labelKey: 'auth.login' };
    }

    return {
        routeName: user.is_admin ? 'admin.dashboard' : 'dashboard',
        labelKey: 'nav.dashboard',
    };
}
