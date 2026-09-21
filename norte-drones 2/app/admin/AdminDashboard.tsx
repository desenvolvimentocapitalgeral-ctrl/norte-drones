"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteContacts } from "@/lib/content-store";

const EMPTY: SiteContacts = {
  whatsappNumber: "",
  whatsappMessage: "",
  phone: "",
  email: "",
  instagramHandle: "",
  instagramUrl: "",
  address: "",
  areaServed: "",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [form, setForm] = useState<SiteContacts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.contacts) setForm(data.contacts);
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SiteContacts>(key: K, value: SiteContacts[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erro ao salvar." });
        return;
      }
      setForm(data.content.contacts);
      setMessage({ type: "ok", text: "Contatos atualizados com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Erro de conexão ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) {
    return <div className="p-8 text-sm text-nd-graphite/60">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nd-green-dark">
            Painel administrativo
          </h1>
          <p className="mt-1 text-sm text-nd-graphite/70">
            Atualize os contatos exibidos no site (WhatsApp, telefone, e-mail
            e Instagram).
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-nd-graphite hover:bg-black/5"
        >
          Sair
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-nd-amber/10 p-4 text-sm text-nd-graphite/80 ring-1 ring-nd-amber/30">
        Em produção na Vercel, sem um banco de dados configurado, estas
        alterações ficam válidas apenas enquanto a instância do servidor
        estiver ativa (o sistema de arquivos do deploy é somente leitura).
        Para persistência definitiva, veja a seção “Painel admin e
        persistência” no README antes de divulgar o site.
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl bg-white p-8 shadow-card ring-1 ring-black/5">
        <Field
          label="Número de WhatsApp (com DDI e DDD, apenas números)"
          placeholder="Ex.: 5563999999999"
          value={form.whatsappNumber}
          onChange={(v) => update("whatsappNumber", v)}
        />
        <Field
          label="Mensagem padrão do WhatsApp"
          placeholder="Olá! Vim pelo site da Norte Drones..."
          value={form.whatsappMessage}
          onChange={(v) => update("whatsappMessage", v)}
          textarea
        />
        <Field
          label="Telefone"
          placeholder="(63) 99999-9999"
          value={form.phone}
          onChange={(v) => update("phone", v)}
        />
        <Field
          label="E-mail"
          placeholder="contato@nortedrones.com.br"
          type="email"
          value={form.email}
          onChange={(v) => update("email", v)}
        />
        <Field
          label="Instagram (usuário)"
          placeholder="@nortedrones"
          value={form.instagramHandle}
          onChange={(v) => update("instagramHandle", v)}
        />
        <Field
          label="Instagram (link completo)"
          placeholder="https://instagram.com/nortedrones"
          value={form.instagramUrl}
          onChange={(v) => update("instagramUrl", v)}
        />
        <Field
          label="Endereço"
          placeholder="Porto Nacional - TO"
          value={form.address}
          onChange={(v) => update("address", v)}
        />
        <Field
          label="Área de atuação (texto exibido no site)"
          placeholder="Porto Nacional, Palmas e região (Tocantins)"
          value={form.areaServed}
          onChange={(v) => update("areaServed", v)}
        />

        {message && (
          <p
            className={`text-sm font-medium ${
              message.type === "ok" ? "text-nd-green" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-nd-green-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nd-green disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-nd-graphite">
      {label}
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green"
        />
      )}
    </label>
  );
}
