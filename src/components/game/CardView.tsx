'use client';

import { useEffect, useState } from "react";
import styles from "./CardView.module.css";
import { CardArt } from "@/components/CardArt";
import { resolveDef } from "@/lib/cards/resolve";
import { getArtUrl } from "@/lib/cards/getArtUrl";
import type { CardDefinition, CardId } from "@/lib/cards/catalog";

export type CardState = "idle" | "selected" | "attacking" | "disabled";

type Props = {
  cardId: CardId;
  state?: CardState;
  onClick?: () => void;
};

export function CardView({ cardId, state = "idle", onClick }: Props) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempt(0);
  }, [cardId]);
  let def: CardDefinition | null = null;
  try {
    def = resolveDef(cardId);
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
  const artCandidates = [getArtUrl(def)];
  const imgSrc = artCandidates[attempt] ?? artCandidates[0];
  const name = def.name ?? def.id;

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
        <span>{def.unit.toLowerCase()}</span>
        <span>{def.variant.toString().toLowerCase()}</span>
      </div>
        <div className={styles.body}>
          <div className={styles.imgWrap}>
            <CardArt
              src={imgSrc}
              alt={name}
              className={styles.img}
            />
          </div>
        <div className={styles.name}>{name}</div>
      </div>
    </button>
  );
}
