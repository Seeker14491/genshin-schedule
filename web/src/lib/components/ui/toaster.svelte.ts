export type Toast = {
  id: number;
  title: string;
  description?: string;
};

const Duration = 5000;

/** Error notices shown in the top right corner of the page (see `Toaster.svelte`). */
class Toaster {
  toasts = $state<Toast[]>([]);
  private nextId = 0;

  error(title: string, description?: string) {
    const id = this.nextId++;

    this.toasts.push({ id, title, description });
    setTimeout(() => this.dismiss(id), Duration);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }
}

export const toaster = new Toaster();
