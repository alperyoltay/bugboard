"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, type Bug } from "@/lib/api";

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export async function createBug(form: FormData) {
  const bug = await api<Bug>("/bugs", {
    method: "POST",
    body: JSON.stringify({
      title: field(form, "title"),
      description: field(form, "description"),
      stepsToReproduce: field(form, "stepsToReproduce"),
      severity: field(form, "severity"),
    }),
  });
  revalidatePath("/");
  redirect(`/bugs/${bug.id}`);
}

export async function updateStatus(id: number, form: FormData) {
  await api(`/bugs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: field(form, "status") }),
  });
  revalidatePath(`/bugs/${id}`);
}

export async function deleteBug(id: number) {
  await api(`/bugs/${id}`, { method: "DELETE" });
  revalidatePath("/");
  redirect("/");
}
