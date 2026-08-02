import React from "react";
import { HelperText, TextInput as PaperTextInput, type TextInputProps as PaperTextInputProps } from "react-native-paper";

export type AppTextInputProps = PaperTextInputProps & {
  errorMessage?: string;
};

/**
 * Thin wrapper around Paper's TextInput (always outlined, for visual
 * consistency) plus a built-in error slot, so form fields don't each
 * hand-roll their own HelperText placement.
 */
export function AppTextInput({ errorMessage, ...rest }: AppTextInputProps) {
  return (
    <>
      <PaperTextInput mode="outlined" error={!!errorMessage} {...rest} />
      {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}
    </>
  );
}
