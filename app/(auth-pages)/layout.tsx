export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
