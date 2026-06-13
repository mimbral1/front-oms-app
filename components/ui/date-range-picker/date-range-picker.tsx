// components/DateRangeField.tsx
"use client";
import { FC, useState } from "react";
import {
  TextField,
  IconButton,
  Popper,
  Paper,
  Stack,
  Box,
  ClickAwayListener,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface Range {
  from: Date;
  to: Date;
}

interface Props {
  label?: string;
  value: Range;
  onChange: (r: Range) => void;
  fullWidth?: boolean;
}

/** Formatea dd/MM/yyyy HH:mm con la zona local */
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d) +
  " " +
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export const DateRangeField: FC<Props> = ({
  label = "Fecha",
  value,
  onChange,
  fullWidth = true,
}) => {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  /** ▸ Convierte la cadena ISO de los inputs en Date */
  const handle =
    (key: "from" | "to") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const iso = e.target.value;
      if (!iso) return;
      const date = new Date(iso);
      onChange({ ...value, [key]: date });
    };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
        {/* ------- Input visible -------- */}
        <TextField
          label={label}
          fullWidth={fullWidth}
          value={`${fmt(value.from)} - ${fmt(value.to)}`}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <IconButton
                size="small"
                onClick={(e) => {
                  setAnchor(e.currentTarget);
                  setOpen((o) => !o);
                }}
              >
                <ExpandMoreIcon fontSize="inherit" />
              </IconButton>
            ),
          }}
          onClick={(e) => {
            setAnchor(e.currentTarget as HTMLElement);
            setOpen(true);
          }}
        />

        {/* ------- Popper con los 2 pickers nativos -------- */}
        <Popper open={open} anchorEl={anchor} placement="bottom-start">
          <Paper sx={{ p: 2, mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Desde"
                type="datetime-local"
                value={value.from.toISOString().slice(0, 16)} // yyyy-MM-ddTHH:mm
                onChange={handle("from")}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hasta"
                type="datetime-local"
                value={value.to.toISOString().slice(0, 16)}
                onChange={handle("to")}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};
