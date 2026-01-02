'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import styles from "./CardView.module.css";
import { CardArt } from "@/components/CardArt";
import { resolveDef } from "@/lib/cards/resolve";
import { getArtUrl } from "@/lib/cards/getArtUrl";
import type { CardDefinition, CardId } from "@/lib/cards/catalog";

type Size = "compact" | "medium" | "large";

export type CardViewProps = {
  card?: CardDefinition | null;
  cardId?: CardId;
  powerOverride?: number;
  size?: Size;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showPower?: boolean;
  className?: string;
};

const sizeClass: Record<Size, string> = {
  compact: styles.compact,
  medium: styles.medium,
  large: styles.large,
};

const CardViewWarnings = new Set<string>();

export function CardView(props: CardViewProps) {
  const {
    cardId,
    powerOverride,
    size = "compact",
    selected = false,
    disabled = false,
    onClick,
    showPower = true,
    className = "",
  } = props;
  const [imgFailed, setImgFailed] = useState(false);
  let cardDef = props.card ?? null;
  const warnedMissing = CardViewWarnings;

  if (!cardDef && cardId) {
    try {
      cardDef = resolveDef(cardId);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        const key = `missing-cardid:${cardId}`;
        if (!warnedMissing.has(key)) {
          console.warn("CardView missing registry entry for cardId:", cardId, error);
          warnedMissing.add(key);
        }
      }
    }
  }

  const resetKey = cardDef?.id ?? cardId ?? "unknown";

  useEffect(() => {
    setImgFailed(false);
  }, [resetKey]);

  if (!cardDef) {
    if (process.env.NODE_ENV !== "production") {
      if (!warnedMissing.has("missing-card")) {
        console.warn("CardView received no card definition.");
        warnedMissing.add("missing-card");
      }
    }
    return (
      <div
        className={[
          styles.card,
          sizeClass[size],
          disabled ? styles.disabled : "",
          className,
        ].join(" ")}
      >
        <div className={styles.placeholder} aria-hidden>
          <span className={styles.placeholderText}>?</span>
        </div>
      </div>
    );
  }

  const name = cardDef.name ?? cardDef.id;
  const power = powerOverride ?? cardDef.power;
  const unitType = cardDef.unit;
  const artUrl = getArtUrl(cardDef);
  const useArt = !!artUrl && !imgFailed;

  if (process.env.NODE_ENV !== "production") {
    const key = cardDef.id ?? "unknown-card";
    if (!warnedMissing.has(key) && !artUrl) {
      console.warn("CardView missing art url for card:", cardDef);
      warnedMissing.add(key);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        styles.card,
        sizeClass[size],
        selected ? styles.selected : "",
        disabled ? styles.disabled : "",
        className,
      ].join(" ")}
      title={name}
    >
      <div className={styles.header}>
        <span className={styles.unit}>{unitType}</span>
        {showPower && power !== undefined && <span className={styles.power}>P:{power}</span>}
      </div>
      <div className={styles.body}>
        {useArt ? (
          <div className={styles.artWrap}>
            <CardArt
              src={artUrl}
              alt={name}
              className={styles.art}
            />
          </div>
        ) : (
          <div className={styles.placeholder} aria-hidden>
            <span className={styles.placeholderText}>{name[0] ?? "?"}</span>
          </div>
        )}
        <div className={styles.name} title={name}>
          {name}
        </div>
      </div>
    </button>
  );
}
