import { Streamdown } from "solid-streamdown";

const markdown = "```js\nconsole.log('hola');\n```\n\n[Documentación](https://docs.solidjs.com)";

export default function SpanishLabels() {
  return (
    <Streamdown
      translations={{
        copyCode: "Copiar código",
        close: "Cerrar",
        openLink: "Abrir enlace",
        downloadImage: "Descargar imagen",
      }}
    >
      {markdown}
    </Streamdown>
  );
}
