interface NotificationStackProps {
  children: React.ReactNode;
}

export function NotificationStack({ children }: NotificationStackProps) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 md:bottom-4 md:left-auto md:w-96">
      {children}
    </div>
  );
}
