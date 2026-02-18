import { Store } from "lucide-react";

export function NoRestaurantSelected() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <Store className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="text-lg font-medium text-muted-foreground">
        Nenhum restaurante selecionado
      </h3>
      <p className="text-sm text-muted-foreground/70">
        Selecione uma conta iFood e um restaurante no menu superior para
        visualizar os dados.
      </p>
    </div>
  );
}
