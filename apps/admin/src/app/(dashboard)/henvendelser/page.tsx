import { MessagesList } from "@/components/contact/messages-list";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Henvendelser</h1>
        <p className="text-muted-foreground text-sm">
          Meldinger sendt inn via kontaktskjemaet på nettsiden.
        </p>
      </div>

      <MessagesList />
    </div>
  );
}
