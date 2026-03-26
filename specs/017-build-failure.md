# Next build failure

Fix the following build error:

```plaintext
$ next build
   ▲ Next.js 15.5.14

   Creating an optimized production build ...
<w> [webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item 'Compilation/modules|javascript/auto|/home/runner/work/koreni/koreni/node_modules/next/dist/build/webpack/loaders/next-flight-css-loader.js??ruleSet[1].rules[14].oneOf[5].use[0]!/home/runner/work/koreni/koreni/node_modules/next/dist/build/webpack/loaders/css-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[1]!/home/runner/work/koreni/koreni/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js??ruleSet[1].rules[14].oneOf[5].use[2]!/home/runner/work/koreni/koreni/src/app/components/contribute2/contribute-form.module.css|ssr': No serializer registered for CssSyntaxError
<w> while serializing webpack/lib/cache/PackFileCacheStrategy.PackContentItems -> webpack/lib/NormalModule -> webpack/lib/ModuleBuildError -> CssSyntaxError
Failed to compile.

./src/app/components/contribute2/contribute-form.module.css:49:1
Syntax error: Selector "input:focus-visible,
textarea:focus-visible,
select:focus-visible" is not pure (pure selectors must contain at least one local class or id)

  47 |
  48 | /* Ensure all inputs use focus-visible for better accessibility */
> 49 | input:focus-visible,
     | ^
  50 | textarea:focus-visible,
  51 | select:focus-visible {


> Build failed because of webpack errors
```
