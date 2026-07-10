import { Alert as RNAlert, Platform } from "react-native";

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 0) {
        // Look for primary/destructive action button and cancel button
        const actionButton = buttons.find((b) => b.style !== "cancel") || buttons[0];
        const cancelButton = buttons.find((b) => b.style === "cancel");

        const confirmMessage = message ? `${title}\n\n${message}` : title;
        const confirmed = window.confirm(confirmMessage);

        if (confirmed) {
          if (actionButton && actionButton.onPress) {
            actionButton.onPress();
          }
        } else {
          if (cancelButton && cancelButton.onPress) {
            cancelButton.onPress();
          }
        }
      } else {
        const alertMessage = message ? `${title}\n\n${message}` : title;
        window.alert(alertMessage);
      }
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};
