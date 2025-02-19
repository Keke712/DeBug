import { ethers } from 'ethers';

export const stringToBytes32 = (text: string): string => {
    try {
        // Validate input
        if (!text) {
            throw new Error("Empty string not allowed");
        }

        // Convert string to bytes and pad to 32 bytes
        const textBytes = ethers.toUtf8Bytes(text);
        if (textBytes.length > 31) {
            throw new Error("String is too long - max 31 bytes");
        }

        // Pad with zeros to make it 32 bytes
        const paddedBytes = new Uint8Array(32);
        paddedBytes.set(textBytes);

        // Convert to hex string
        const hex = ethers.hexlify(paddedBytes);
        return hex;
    } catch (error) {
        console.error('Error converting string to bytes32:', error);
        // Return a default value in case of error
        return ethers.hexlify(new Uint8Array(32)); // Return empty bytes32
    }
};

export const bytes32ToString = (bytes32: any): string => {
    try {
        // Convert to hex string if bytes32 is not a string
        const hexString = typeof bytes32 === 'string' ? bytes32 : ethers.hexlify(bytes32);

        // Validate input
        if (!hexString || !hexString.startsWith('0x')) {
            throw new Error("Invalid bytes32 value");
        }

        // Convert hex string to bytes and remove trailing zeros
        const bytes = ethers.getBytes(hexString);
        let length = bytes.length;
        while (length > 0 && bytes[length - 1] === 0) {
            length--;
        }

        // Convert bytes to string
        return ethers.toUtf8String(bytes.slice(0, length));
    } catch (error) {
        console.error('Error decoding bytes32:', error);
        return '';
    }
};


