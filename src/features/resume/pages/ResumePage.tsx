"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { RESUME_PDF_PATH } from "@shared/constants";
import { Button } from "@shared/ui/Button";
import styles from "./ResumePage.module.css";

const CIPHER_GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789";

function DecryptText({
  text,
  delay,
  duration,
}: {
  text: string;
  delay: number;
  duration: number;
}) {
  const characters = Array.from(text);
  const [display, setDisplay] = useState({
    characters,
    settled: characters.map(() => true),
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const settlesAt = characters.map((character) =>
      /\s/.test(character)
        ? 0
        : delay + duration * (0.18 + Math.random() * 0.82),
    );
    const startedAt = performance.now();
    let frame = 0;
    setDisplay({
      characters: characters.map((character, index) =>
        /\s/.test(character)
          ? character
          : CIPHER_GLYPHS[(index * 7 + 3) % CIPHER_GLYPHS.length],
      ),
      settled: characters.map((character) => /\s/.test(character)),
    });
    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      frame += 1;
      const settled = characters.map(
        (character, index) => /\s/.test(character) || elapsed >= settlesAt[index],
      );
      setDisplay({
        characters: characters.map((character, index) =>
          settled[index]
            ? character
            : CIPHER_GLYPHS[
                (index * 11 + frame * (3 + (index % 3))) % CIPHER_GLYPHS.length
              ],
        ),
        settled,
      });
      if (elapsed >= delay + duration) {
        window.clearInterval(interval);
        setDisplay({
          characters,
          settled: characters.map(() => true),
        });
      }
    }, 76);
    return () => window.clearInterval(interval);
  }, [delay, duration, text]);

  let characterIndex = 0;

  return (
    <span className={styles.cipherText} aria-label={text}>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((token, tokenIndex) => {
          if (/^\s+$/.test(token)) {
            characterIndex += Array.from(token).length;
            return token;
          }
          return (
            <span className={styles.cipherWord} key={`${token}-${tokenIndex}`}>
              {Array.from(token).map((character) => {
                const index = characterIndex;
                characterIndex += 1;
                return (
                  <span className={styles.cipherCharacter} key={`${character}-${index}`}>
                    <span className={styles.cipherMeasure}>{character}</span>
                    <span
                      className={styles.cipherGlyph}
                      data-settled={display.settled[index] ? "true" : "false"}
                      style={
                        {
                          "--cipher-delay": `${-(index % 9) * 31}ms`,
                        } as CSSProperties
                      }
                    >
                      {display.characters[index]}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export function ResumePage() {
  const leadFirst = "If you want to know more about me download my résumé.";
  const leadSecond = "Feel free to use that data in any recruitment process.";

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>
        <DecryptText text="my résumé" delay={0} duration={1100} />
      </h1>
      <p className={styles.lead}>
        <DecryptText text={leadFirst} delay={100} duration={1250} />
        <span className={styles.sentenceBreak} aria-hidden="true" />
        <DecryptText text={leadSecond} delay={160} duration={1240} />
      </p>
      <Button
        href={RESUME_PDF_PATH}
        download
        variant="glass"
        iconSrc="/assets/icons/pdf.svg"
        iconSize={18}
        className={styles.cta}
        decryptIcon
      >
        <DecryptText text="Download PDF" delay={260} duration={1300} />
      </Button>
    </section>
  );
}
