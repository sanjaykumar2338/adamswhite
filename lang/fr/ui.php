<?php

return [
    'validation' => [
        'google_review_url' => 'Saisissez une URL HTTPS Google Avis valide.',
        'already_claimed' => 'Ce produit a déjà été activé.',
        'product_limit' => 'Votre compte a atteint sa limite de produits.',
        'already_member' => "Cette personne dispose déjà d'un accès actif à l'organisation.",
        'invitation_pending' => 'Une invitation active est déjà en attente pour cette adresse e-mail.',
        'dashboard_disabled' => "L'accès au tableau de bord de ce compte client est désactivé. Les produits physiques déjà activés continuent de fonctionner.",
    ],
    'flash' => [
        'product_activated' => 'Produit activé avec succès.',
        'review_updated' => "La destination de l'avis a été mise à jour.",
        'product_updated' => 'Produit mis à jour.',
        'customer_updated' => 'Client mis à jour.',
        'product_reset' => 'Produit réinitialisé comme non activé.',
        'settings_saved' => 'Paramètres enregistrés.',
        'invitation_sent' => "L'invitation du gestionnaire a été envoyée.",
        'member_removed' => "Le membre de l'équipe a été supprimé.",
        'invitation_accepted' => 'Invitation acceptée.',
        'invitation_revoked' => 'Invitation révoquée.',
        'profile_updated' => 'Profil mis à jour.',
        'password_updated' => 'Mot de passe mis à jour.',
        'sessions_revoked' => 'Les autres sessions connectées ont été révoquées.',
        'deletion_requested' => 'Votre demande de suppression a été transmise pour examen administratif.',
        'deletion_reviewed' => "L'examen de la demande a été enregistré. Aucune donnée client n'a été supprimée automatiquement.",
        'password_reset_sent' => 'Un e-mail de réinitialisation a été envoyé au propriétaire du compte.',
        'products_assigned' => 'La plage de produits disponibles a bien été attribuée.',
        'future_inventory_created' => "La plage séparée d'inventaire futur a bien été créée.",
    ],
    'mail' => [
        'invite_subject' => 'Vous êtes invité à gérer :business sur Shiftrix Track',
        'invite_line' => 'Vous avez été invité à gérer les produits SHIFTRIX de :business dans Shiftrix Track.',
        'invite_action' => "Accepter l'invitation",
        'invite_expiry' => 'Cette invitation expire dans sept jours.',
    ],
    'privacy' => [
        'export_retention' => "Les identifiants permanents des produits, les URL NFC et l'historique opérationnel des scans peuvent être conservés pour l'intégrité du service ou les obligations légales.",
    ],
    'analytics' => ['unknown' => 'Inconnu'],
    'sessions' => ['unknown_browser' => 'Navigateur inconnu', 'unknown_device' => 'Appareil inconnu', 'unavailable' => 'Indisponible'],
];
