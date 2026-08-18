import { createContext, useContext, useState, useCallback } from "react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const addDialog = useCallback((config) => {
    return new Promise((resolve) => {
      setDialogs((prev) => [...prev, { ...config, id: Date.now() + Math.random(), resolve }]);
    });
  }, []);

  const alert = useCallback((message, title = "Alert") => {
    return addDialog({ type: "alert", title, message });
  }, [addDialog]);

  const confirm = useCallback((message, title = "Confirm") => {
    return addDialog({ type: "confirm", title, message });
  }, [addDialog]);

  const prompt = useCallback((message, title = "Input Required", defaultValue = "") => {
    return addDialog({ type: "prompt", title, message, defaultValue });
  }, [addDialog]);

  const closeDialog = useCallback((id, result) => {
    setDialogs((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target) target.resolve(result);
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const currentDialog = dialogs[0];

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {currentDialog && (
        <DialogModal
          key={currentDialog.id}
          dialog={currentDialog}
          onClose={(res) => closeDialog(currentDialog.id, res)}
        />
      )}
    </DialogContext.Provider>
  );
}

function DialogModal({ dialog, onClose }) {
  const [inputVal, setInputVal] = useState(dialog.defaultValue || "");

  const handleConfirm = () => {
    if (dialog.type === "prompt") onClose(inputVal);
    else if (dialog.type === "confirm") onClose(true);
    else onClose();
  };

  const handleCancel = () => {
    if (dialog.type === "prompt") onClose(null);
    else if (dialog.type === "confirm") onClose(false);
    else onClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleCancel}
      title={dialog.title}
      width="max-w-md"
      onSubmit={handleConfirm}
      footer={
        <div className="flex justify-end gap-2 w-full">
          {dialog.type !== "alert" && (
            <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
          )}
          <Button 
            variant={(dialog.type === "confirm" || dialog.type === "prompt") && dialog.title.toLowerCase().includes("warning") ? "danger" : "primary"} 
            type="submit"
          >
            OK
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-ink-700 mb-4 whitespace-pre-wrap">{dialog.message}</p>
        {dialog.type === "prompt" && (
          <input
            type="text"
            autoFocus
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-canvas-50 border border-canvas-200 rounded-lg px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-paprika-500/50"
          />
        )}
      </div>
    </Modal>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
}
