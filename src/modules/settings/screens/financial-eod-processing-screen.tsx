"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FormField } from "@/components/ui/molecules/form-field/form-field";

import "./financial-eod-processing-screen.css";

const INITIAL_MODE = "automatic";

export function FinancialEodProcessingScreen() {
  const [savedMode, setSavedMode] = useState(INITIAL_MODE);
  const [mode, setMode] = useState(INITIAL_MODE);

  return (
    <div className="zelify-eod-processing">
      <form
        className="zelify-eod-processing__form"
        onSubmit={(e) => {
          e.preventDefault();
          setSavedMode(mode);
        }}
      >
        <FormField
          className="zelify-eod-processing__field"
          label={<FieldLabel htmlFor="eod-processing-mode">End Of Day Processing</FieldLabel>}
          control={
            <AppSelect
              id="eod-processing-mode"
              size="md"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="disabled">Disabled</option>
            </AppSelect>
          }
        />

        <hr className="zelify-eod-processing__rule" aria-hidden />

        <div className="zelify-eod-processing__actions">
          <AppButton type="submit" tone="primary">
            Save Changes
          </AppButton>
          <AppButton type="button" tone="secondary" onClick={() => setMode(savedMode)}>
            Cancel
          </AppButton>
        </div>
      </form>
    </div>
  );
}
