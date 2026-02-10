export default function DebugLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html>
            <body>{children}</body>
        </html>
    )
}
