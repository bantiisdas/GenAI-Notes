import { get_encoding, encoding_for_model } from "tiktoken";

const enc = get_encoding("gpt2");

const encoded = enc.encode("Hello, I am Supriya");
console.log(encoded);

const decoded = enc.decode(encoded);
console.log(decoded);

const wordDecode = new TextDecoder().decode(decoded);
console.log(wordDecode);
