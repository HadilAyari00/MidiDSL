import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { MidiLangLanguageMetaData } from '../language/generated/module.js';
import { createMidiLangServices } from '../language/midi-lang-module.js';
import { extractAstNode } from './cli-util.js';
import { parseAndValidate } from './parseAndValidate.js';
import { generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMidiLangServices(NodeFileSystem).MidiLang;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export const listMidiFiles = async (): Promise<void> => {
    const midiDirectory = path.resolve(__dirname, '..', 'Midis');
    try {
        const files = await fs.readdir(midiDirectory);
        const midiFiles = files.filter(file => path.extname(file) === '.mid');
        console.log('MIDI Files:', midiFiles);
    } catch (error) {
        console.error('Error reading the Midis directory:', error);
    }
};

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = MidiLangLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);
    
    program
        .command('parseAndValidate')
        .argument('<file>', `source file to parse & validate (ending in ${fileExtensions})`)
        .description('Indicates where a program parses & validates successfully, but produces no output code')
        .action(parseAndValidate);

    program.parse(process.argv);

    program
    .command('listMidi')
    .description('List all MIDI files in the Midis directory')
    .action(listMidiFiles);
}
