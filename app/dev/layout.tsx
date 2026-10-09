import { notFound } from "next/navigation";

// /dev/* is for local development and Vercel previews only.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return children;
}
