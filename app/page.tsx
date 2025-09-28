// app/page.tsx  (Server Component)
import { redirect } from "next/navigation";

export default function Page() {
  // send anyone visiting "/" to the community page
  redirect("/ask");
}
