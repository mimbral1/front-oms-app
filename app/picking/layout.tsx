export default function PickingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <div>{children}</div>
      </main>
    </div>
  );
}
