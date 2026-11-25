export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-76px-56px)] bg-warm-white px-5 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
