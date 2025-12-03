import { Button, buttonVariants } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Mediouna Action</h1>
      <nav className="flex gap-2">
        <Button className={buttonVariants({ variant: "outline" })}>
          Home
        </Button>
        <Button className={buttonVariants({ variant: "outline" })}>
          About
        </Button>
        <Button className={buttonVariants({ variant: "default" })}>
          Contact
        </Button>
      </nav>
    </header>
  );
}
