const encode = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function key(secret: string) {
	if (!/^[a-f0-9]{64}$/i.test(secret))
		throw new Error('Calendar encryption key must contain 64 hexadecimal characters.');
	return crypto.subtle.importKey(
		'raw',
		Uint8Array.from(secret.match(/../g)!, (v) => parseInt(v, 16)),
		'AES-GCM',
		false,
		['encrypt', 'decrypt']
	);
}
export async function encryptToken(value: string, secret: string, owner: string) {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(owner) },
		await key(secret),
		new TextEncoder().encode(value)
	);
	return `${encode(iv)}.${encode(new Uint8Array(ciphertext))}`;
}
export async function decryptToken(value: string, secret: string, owner: string) {
	const [iv, ciphertext] = value.split('.');
	return new TextDecoder().decode(
		await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: decode(iv), additionalData: new TextEncoder().encode(owner) },
			await key(secret),
			decode(ciphertext)
		)
	);
}
