export default function GmailTab() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {/* Gmail icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Gmail
            </h3>

            {/* Coming soon badge */}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mb-4">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Bientôt disponible
            </span>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">
                L'intégration Gmail arrivera dans la prochaine version pour synchroniser vos emails importants.
            </p>

            {/* Version indicator */}
            <div className="mt-6 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Prévu pour la <span className="font-medium text-gray-700 dark:text-gray-300">V2</span>
                </span>
            </div>
        </div>
    );
}
