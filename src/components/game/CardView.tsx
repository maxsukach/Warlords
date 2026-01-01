'use client';

import { useEffect, useState } from "react";
import styles from "./CardView.module.css";
import { getCardArtCandidates, getCardArtUrl, getCardDef, type CardDefinition, type CardId } from "@/domain/cards";

export type CardState = "idle" | "selected" | "attacking" | "disabled";

type Props = {
  cardId: CardId;
  state?: CardState;
  onClick?: () => void;
};

export function CardView({ cardId, state = "idle", onClick }: Props) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setAttempt(0);
  }, [cardId]);
  let def: CardDefinition | null = null;
  try {
    def = getCardDef(cardId);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Demo CardView missing registry entry:", cardId, error);
    }
  }
  if (!def) {
    return (
      <button type="button" className={[styles.card, styles.idle].join(" ")} disabled>
        <div className={styles.header}>
          <span>unknown</span>
          <span>basic</span>
        </div>
        <div className={styles.body}>
          <div className={styles.imgWrap} />
          <div className={styles.name}>Unknown</div>
        </div>
      </button>
    );
  }
  const artCandidates = getCardArtCandidates(cardId);
  const imgSrc = getCardArtUrl(cardId, { attempt });
  const name = def.displayName ?? def.shortName ?? def.id;

  const stateClass =
    state === "selected"
      ? styles.selected
      : state === "attacking"
      ? styles.attacking
      : state === "disabled"
      ? styles.disabled
      : styles.idle;

  return (
    <button
      type="button"
      className={[styles.card, stateClass].join(" ")}
      onClick={onClick}
      disabled={state === "disabled"}
      title={name}
    >
      <div className={styles.header}>
        <span>{def.unitType.toLowerCase()}</span>
        <span>{(def.rarity ?? "basic").toString().toLowerCase()}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.imgWrap}>
          <img
            src={imgSrc}
            alt={name}
            className={styles.img}
            onError={() => {
              if (attempt < artCandidates.length - 1) {
                setAttempt((prev) => prev + 1);
              }
            }}
          />
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </button>
  );
}
