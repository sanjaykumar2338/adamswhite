<?php

return [
    'validation' => [
        'google_review_url' => 'Enter a valid HTTPS Google Reviews URL.',
        'already_claimed' => 'This product has already been claimed.',
        'product_limit' => 'Your account has reached its product limit.',
    ],
    'flash' => [
        'product_activated' => 'Product activated successfully.',
        'review_updated' => 'Review destination updated.',
        'customer_updated' => 'Customer updated.',
        'product_reset' => 'Product reset to unclaimed.',
        'settings_saved' => 'Settings saved.',
        'invitation_sent' => 'Manager invitation sent.',
        'member_removed' => 'Team member removed.',
        'invitation_accepted' => 'Invitation accepted.',
    ],
    'mail' => [
        'invite_subject' => "You're invited to manage :business on SHIFTRIX",
        'invite_line' => "You have been invited to manage :business's SHIFTRIX products.",
        'invite_action' => 'Accept invitation',
        'invite_expiry' => 'This invitation expires in seven days.',
    ],
];
