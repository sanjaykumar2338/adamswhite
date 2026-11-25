export function pauseAndReset(player) {
    if (!player) return;

    player.pause();
    try {
        player.currentTime = 0;
    } catch {
        // The media may not have loaded enough metadata to seek yet.
    }
    player.load();
}
