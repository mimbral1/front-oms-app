// components/Code/CodeBlock.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Highlight,
  themes,
  type Language,
  type RenderProps,
} from "prism-react-renderer";
import { codeBlockContainer, codeBlockPre } from "./code-block.styles";

interface CodeBlockProps {
  code: string;
  language: Language;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  onChange?: (value: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  className = "",
  style = {},
  editable = false,
  onChange,
}) => {
  const [value, setValue] = useState(code);

  // Si el prop `code` cambia externamente, sincronizamos
  useEffect(() => setValue(code), [code]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLPreElement>) => {
      const newText = e.currentTarget.innerText;
      setValue(newText);
      onChange?.(newText);
    },
    [onChange]
  );

  return (
    <div
      className={`${codeBlockContainer} ${className}`}
      style={style}
    >
      <Highlight
        code={value.trim()}
        language={language}
        theme={themes.nightOwl}
      >
        {(props: RenderProps) => {
          const {
            className: preClass,
            style: preStyle,
            tokens,
            getLineProps,
            getTokenProps,
          } = props;

          return (
            <pre
              className={`${preClass} ${codeBlockPre}`}
              style={preStyle}
              contentEditable={editable}
              suppressContentEditableWarning={editable}
              onInput={editable ? handleInput : undefined}
            >
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineProps } = getLineProps({
                  line,
                  key: i,
                });
                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, idx) => {
                      const { key: _tokenKey, ...tokenProps } = getTokenProps({
                        token,
                        key: idx,
                      });
                      return <span key={idx} {...tokenProps} />;
                    })}
                  </div>
                );
              })}
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
