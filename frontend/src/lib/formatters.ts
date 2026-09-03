function getStageDotColor(stage: string) {
    if (stage === 'New') return 'bg-pink-500'
    if (stage === 'Contacted') return 'bg-orange-500'
    if (stage === 'Demo Scheduled') return 'bg-yellow-500'
    if (stage === 'Customer') return 'bg-green-500'
    if (stage === 'Lost') return 'bg-red-500'
}

function timeAgo(last_activity_at: string) {
    const last_activity = new Date(last_activity_at).getTime();
    const nowInMillInSeconds = Date.now();
    const elapsedSeconds = Math.floor((nowInMillInSeconds - last_activity) / 1000);

    if (elapsedSeconds < 60) {
        return 'just now'
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`
    }
    const days = Math.floor(hours / 24)
    if (days < 7) {
        return `${days} day${days === 1 ? '' : 's'} ago`
    }
    const weeks = Math.floor(days / 7)
    if (weeks < 7) {
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    }
    const months = Math.floor(weeks / 4)
    return `${months} month${months === 1 ? '' : 's'} ago`
}

function resultsCount(count: number) {
    return `${count} result${count === 1 ? '' : 's'}`
}

export { getStageDotColor, timeAgo, resultsCount }