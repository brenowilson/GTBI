import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantStore } from "@/stores/restaurant.store";

export function RestaurantSelector() {
  const {
    selectedAccount,
    selectedRestaurant,
    accounts,
    restaurants,
    isLoadingAccounts,
    setSelectedAccount,
    setSelectedRestaurant,
  } = useRestaurantStore();

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Carregando contas...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Nenhuma conta iFood conectada.{" "}
          <Link to="/admin" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Conectar conta
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedAccount?.id ?? ""}
        onValueChange={(value) => {
          const account = accounts.find((a) => a.id === value);
          setSelectedAccount(account ?? null);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Conta iFood" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAccount && (
        <Select
          value={selectedRestaurant?.id ?? ""}
          onValueChange={(value) => {
            const restaurant = restaurants.find((r) => r.id === value);
            setSelectedRestaurant(restaurant ?? null);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Restaurante" />
          </SelectTrigger>
          <SelectContent>
            {restaurants
              .filter((r) => r.ifood_account_id === selectedAccount.id)
              .map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
