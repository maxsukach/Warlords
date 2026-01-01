'use client';

import styles from "./CardView.module.css";
import { getCardArtUrl, type CardDefinition } from "@/domain/cards";

export type Faction = "cossacks" | "poles" | "tatars" | "moscovites";
export type Kind = "infantry" | "archer" | "cavalry" | "scout" | "siege" | "fort" | "leader";
export type Variant = "basic";
export type CardState = "idle" | "selected" | "attacking" | "disabled";

type Props = {
  faction: Faction;
  kind: Kind;
  variant: Variant;
  state?: CardState;
  onClick?: () => void;
};

export function CardView({ faction, kind, variant, state = "idle", onClick }: Props) {
  const art: CardDefinition["art"] = { fileBase: `${kind}_${variant}`, preferredExt: "png", faction };
  const imgSrc = getCardArtUrl(art, { preferredExt: "png", faction });
  const name = `${kind.charAt(0).toUpperCase()}${kind.slice(1)} (${variant})`;

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
        <span>{kind}</span>
        <span>{variant}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.imgWrap}>
          <img src={imgSrc} alt={name} className={styles.img} />
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </button>
  );
}
