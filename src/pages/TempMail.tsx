import { useEffect, useState, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, RefreshCw, Mail, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API = "https://api.mail.tm";
const STORAGE_KEY = "schebet_tempmail_account";

interface Account {
  address: string;
  password: string;
  token: string;
  id: string;
}

interface Message {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  createdAt: string;
  seen: boolean;
}

interface FullMessage extends Message {
  html?: string[];
  text?: string;
}

const randomString = (len: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const TempMail = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<FullMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAccount(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const createAccount = useCallback(async () => {
    setCreating(true);
    try {
      const domRes = await fetch(`${API}/domains`);
      const domData = await domRes.json();
      const domain = domData["hydra:member"]?.[0]?.domain;
      if (!domain) throw new Error("Nema dostupnih domena");

      const address = `${randomString(10)}@${domain}`;
      const password = randomString(14);

      const accRes = await fetch(`${API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
      });
      if (!accRes.ok) throw new Error("Greška pri kreiranju naloga");
      const accData = await accRes.json();

      const tokRes = await fetch(`${API}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
      });
      if (!tokRes.ok) throw new Error("Greška pri prijavi");
      const tokData = await tokRes.json();

      const newAccount: Account = {
        address,
        password,
        token: tokData.token,
        id: accData.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccount));
      setAccount(newAccount);
      setMessages([]);
      setSelected(null);
      toast({ title: "Nalog kreiran", description: address });
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Pokušajte ponovo",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/messages`, {
        headers: { Authorization: `Bearer ${account.token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        setAccount(null);
        throw new Error("Sesija je istekla — kreiraj nov nalog");
      }
      if (!res.ok) throw new Error("Greška pri učitavanju");
      const data = await res.json();
      setMessages(data["hydra:member"] || []);
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Pokušajte ponovo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!account) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [account, fetchMessages]);

  const openMessage = async (id: string) => {
    if (!account) return;
    try {
      const res = await fetch(`${API}/messages/${id}`, {
        headers: { Authorization: `Bearer ${account.token}` },
      });
      if (!res.ok) throw new Error("Greška pri otvaranju poruke");
      const data = await res.json();
      setSelected(data);
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, seen: true } : msg)));
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Pokušajte ponovo",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAccount(null);
    setMessages([]);
    setSelected(null);
    toast({ title: "Nalog obrisan" });
  };

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    toast({ title: "Adresa kopirana" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-3">
              Privremena e-pošta
            </h1>
            <p className="text-muted-foreground">
              Generiši jednokratnu email adresu — povereno preko mail.tm
            </p>
          </header>

          {!account ? (
            <Card className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Bez aktivnog naloga</h2>
              <p className="text-muted-foreground mb-6">
                Kreiraj novu privremenu adresu jednim klikom.
              </p>
              <Button onClick={createAccount} disabled={creating} size="lg">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kreiranje...
                  </>
                ) : (
                  "Kreiraj adresu"
                )}
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">Tvoja adresa</p>
                    <p className="font-mono text-lg truncate">{account.address}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={copyAddress}>
                      <Copy className="w-4 h-4 mr-2" /> Kopiraj
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                      Osveži
                    </Button>
                    <Button variant="outline" size="sm" onClick={deleteAccount}>
                      <Trash2 className="w-4 h-4 mr-2" /> Nova adresa
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Inbox ({messages.length})
                  </h3>
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Čeka se prva poruka... (auto-osvežavanje na 10s)
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {messages.map((m) => (
                        <li key={m.id}>
                          <button
                            onClick={() => openMessage(m.id)}
                            className={`w-full text-left p-3 rounded-md border transition-colors hover:bg-muted ${
                              selected?.id === m.id ? "bg-muted border-primary" : "border-border"
                            } ${!m.seen ? "font-semibold" : ""}`}
                          >
                            <div className="text-sm truncate">{m.from?.address}</div>
                            <div className="text-sm truncate">{m.subject || "(bez naslova)"}</div>
                            <div className="text-xs text-muted-foreground truncate">{m.intro}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Poruka</h3>
                  {!selected ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Izaberi poruku iz inbox-a
                    </p>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                      <div className="mb-4 pb-4 border-b border-border">
                        <p className="text-sm text-muted-foreground">Od: {selected.from?.address}</p>
                        <p className="font-semibold">{selected.subject || "(bez naslova)"}</p>
                      </div>
                      {selected.html && selected.html.length > 0 ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selected.html.join("") }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm font-sans">{selected.text}</pre>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TempMail;
