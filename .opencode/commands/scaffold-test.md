---
description: Automatically generate a backend unit test for a given source file using global conventions.
---

Read the provided source file and generate a comprehensive unit test (\*.test.ts) in the `src/server/` directory that mirrors the source path. Strictly adhere to the testing conventions.

Context files to read automatically:

- `@src/server/TESTING_CONVENTIONS.md`

!`source_file=$1; echo "Generating test for $source_file..."`
