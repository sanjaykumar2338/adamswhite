export function dashboardWelcomeKey(accountType) {
    if (accountType === 'business') return 'dashboard.welcome_business';
    if (accountType === 'individual') return 'dashboard.welcome_individual';

    return 'dashboard.welcome_back';
}
