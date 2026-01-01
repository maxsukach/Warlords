'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./CardView.module.css";
import { getCardArtCandidates, getCardArtUrl, getCardDef, type CardDefinition } from "@/domain/cards";

type Size = "compact" | "medium" | "large";

export type CardViewProps = {
  card?: CardDefinition | null;
  cardId?: CardDefinition["id"];
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
  const [artAttempt, setArtAttempt] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  let cardDef = props.card ?? null;
  const warnedMissing = CardViewWarnings;

  if (!cardDef && cardId) {
    try {
      cardDef = getCardDef(cardId);
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
    setArtAttempt(0);
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

  if (process.env.NODE_ENV !== "production") {
    const key = cardDef.id ?? "unknown-card";
    if ((!cardDef.art?.baseName || !cardDef.art?.folder) && !warnedMissing.has(key)) {
      console.warn("CardView missing art config for card:", cardDef);
      warnedMissing.add(key);
    }
  }

  const name = cardDef.displayName ?? cardDef.shortName ?? cardDef.id;
  const power = powerOverride ?? cardDef.power;
  const unitType = cardDef.unitType;
  const artCandidates = getCardArtCandidates(cardDef.id);
  const artUrl = getCardArtUrl(cardDef.id, { attempt: artAttempt });
  const useArt = !!artUrl && !imgFailed;

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
            <Image
              src={artUrl}
              alt={name}
              fill
              sizes="(max-width: 480px) 80px, 120px"
              className={styles.art}
              unoptimized
              onError={() => {
                if (artAttempt < artCandidates.length - 1) {
                  setArtAttempt((prev) => prev + 1);
                } else {
                  setImgFailed(true);
                }
              }}
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
