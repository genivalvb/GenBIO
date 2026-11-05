# GenBIO

Plataforma genealógica cronológica que começa pela genealogia bíblica e pode ser usada para qualquer família ou linhagem histórica. É um único arquivo, sem instalação nem servidor.

## Como usar

Abra `index.html` no Chrome ou no Edge. Funciona offline. Os dados ficam no `localStorage` deste navegador, portanto exporte backups em **Dados → Exportar JSON**.

| Ação | Comando |
| --- | --- |
| Mover a árvore | Arrastar, ou setas do teclado |
| Percorrer o tempo | Roda do mouse (Shift + roda move na horizontal) |
| Zoom | Ctrl + roda, pinça ou botões + e − |
| Ver toda a árvore | **Ajustar**, ou tecla `0` |
| Pesquisar | Tecla `/` |
| Ir para um ano ou abrir um evento | Clicar na régua |

## Dados bíblicos iniciais

São 41 pessoas e 17 eventos, de Adão a Abraão (Gênesis 4, 5, 9, 11 e passagens relacionadas), todos marcados como *Registro bíblico inicial*.

O texto declara idades, não anos. Por isso os anos AM são somados a partir das idades de paternidade do **texto massorético**, com a Criação como ano 0. A Septuaginta e o Pentateuco Samaritano trazem números diferentes.

Cada data e vínculo informa sua base:

- **Explícito:** afirmado diretamente pelo texto.
- **Calculado:** obtido somando números do texto.
- **Inferido:** depende de uma interpretação, como o nascimento de Abraão em AM 1948, que lê Gn 11:26 literalmente (outra leitura resulta em AM 2008).
- **Estimado:** valor aproximado sem cálculo textual direto.

Eva, Caim, Abel, Cam, Jafé e a linhagem de Caim, entre outros, ficam **sem data**. Na árvore, eles aparecem com borda tracejada e posição apenas ilustrativa, que nunca é gravada como dado. Quando o texto dá um limite, como "depois dos 500 anos de Noé" (Gn 5:32), ele é guardado como limite, não como ano de nascimento.

## Cronologia

Todos os anos são armazenados em AM. A exibição em a.C./d.C. só é ativada quando o usuário declara o nome de uma metodologia e o ano a.C. correspondente a AM 0. A aplicação não presume nenhuma correlação.

## Modelo de dados

O JSON exportado separa fatos de cálculos. Os graus de parentesco nunca são armazenados: são derivados a cada consulta.

| Coleção | Conteúdo | Equivalente em GEDCOM |
| --- | --- | --- |
| `persons` | Nome, sexo, variações, datas com precisão e base, biografia, fontes | `INDI` |
| `parentLinks` | Pai ou mãe → filho, com papel, natureza (biológica, adotiva, outra) e evidência | `FAMC` / `FAMS`, `PEDI` |
| `unions` | Par de cônjuges, tipo e evidência | `FAM` |
| `events` | Nome, intervalo ou âncora em uma pessoa, personagens e fontes | `EVEN` |

## Código

`index.html` traz os módulos `Store`, `Chrono`, `People`, `Relations`, `Kinship`, `Events`, `Seed`, `Layout`, `View`, `Render`, os componentes de interface e `App`. A árvore usa canvas para linhas e barras de vida, e DOM apenas para os cartões visíveis, o que mantém a navegação fluida com milhares de pessoas.

## Testes

Abra `index.html`, abra o Console (F12), cole o conteúdo de `tests/self-test.js` e pressione Enter. O teste cobre cronologia, parentesco, integridade, cadastro, eventos, persistência, importação e exportação e desempenho com 1.200 pessoas. Os dados originais são restaurados ao final.
