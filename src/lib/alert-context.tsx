import { createContext, useContext, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlertOptions {
  title?: string;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}

interface AlertState {
  type: "alert" | "confirm";
  title?: string;
  message: string;
  resolve?: (value: boolean) => void;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    // Close any existing dialog before showing new one
    setState({
      type: "alert",
      title: options.title,
      message: options.message,
    });
  }, []);

  const showConfirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      // If a dialog is already open, reject previous confirm and show new one
      if (state?.type === "confirm" && state.resolve) {
        state.resolve(false);
      }
      
      return new Promise((resolve) => {
        setState({
          type: "confirm",
          title: options.title,
          message: options.message,
          resolve,
        });
      });
    },
    [state],
  );

  const handleClose = () => {
    if (state?.type === "confirm" && state.resolve) {
      state.resolve(false);
    }
    setState(null);
  };

  const handleConfirm = () => {
    if (state?.type === "confirm" && state.resolve) {
      state.resolve(true);
    }
    setState(null);
  };

  const isConfirm = state?.type === "confirm";

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Dialog open={!!state} onOpenChange={handleClose}>
        <DialogContent data-testid="custom-dialog">
          <DialogHeader>
            <DialogTitle>
              {state?.title ?? (isConfirm ? "Confirm" : "Alert")}
            </DialogTitle>
            <DialogDescription>{state?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {isConfirm ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  data-testid="dialog-cancel"
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirm} data-testid="dialog-confirm">
                  Confirm
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} data-testid="dialog-ok">
                OK
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}
