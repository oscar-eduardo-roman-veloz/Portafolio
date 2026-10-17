'use strict';

// Recetas de Git. `synonyms[0]` es el valor canónico del slot GIT_TASK; el resto son sinónimos.
// `say` está redactado para escucharse bien; `cmd` es el comando exacto que se muestra en la tarjeta.
module.exports = [
  {
    id: 'UNDO_LAST_COMMIT',
    synonyms: ['deshacer el último commit', 'deshago el último commit', 'quitar el último commit', 'deshacer un commit', 'borrar el último commit'],
    say: 'Usa git reset, guion guion soft, HEAD tilde uno. Deshace el commit pero conserva tus cambios preparados. Si ya lo subiste al remoto, mejor usa git revert para no reescribir el historial.',
    cmd: 'git reset --soft HEAD~1\n# Si ya se publicó:\ngit revert HEAD',
  },
  {
    id: 'CREATE_BRANCH',
    synonyms: ['crear una rama', 'creo una rama', 'hacer una rama nueva', 'crear un branch', 'abrir una rama'],
    say: 'Usa git switch, guion c, y el nombre de la rama. Crea la rama y te cambia a ella en un solo paso.',
    cmd: 'git switch -c nombre-de-la-rama',
  },
  {
    id: 'SWITCH_BRANCH',
    synonyms: ['cambiar de rama', 'cambio de rama', 'moverme a otra rama', 'cambiar de branch'],
    say: 'Usa git switch y el nombre de la rama. Si tienes cambios sin guardar, haz un stash antes.',
    cmd: 'git switch nombre-de-la-rama',
  },
  {
    id: 'DELETE_BRANCH',
    synonyms: ['borrar una rama', 'eliminar una rama', 'borro una rama', 'eliminar un branch'],
    say: 'En local usa git branch, guion d, y el nombre. Para borrarla del remoto usa git push origin, guion guion delete, y el nombre.',
    cmd: 'git branch -d nombre-de-la-rama\ngit push origin --delete nombre-de-la-rama',
  },
  {
    id: 'RENAME_BRANCH',
    synonyms: ['renombrar una rama', 'cambiar el nombre de una rama', 'renombro la rama'],
    say: 'Parado en la rama, usa git branch, guion m mayúscula, y el nombre nuevo. Luego súbela con git push guion u origin y el nombre nuevo.',
    cmd: 'git branch -M nuevo-nombre\ngit push -u origin nuevo-nombre',
  },
  {
    id: 'STASH',
    synonyms: ['guardar cambios temporalmente', 'guardo mis cambios sin hacer commit', 'hacer un stash', 'apartar mis cambios'],
    say: 'Usa git stash push con un mensaje para apartar tus cambios. Cuando quieras recuperarlos, usa git stash pop.',
    cmd: 'git stash push -m "trabajo en progreso"\ngit stash list\ngit stash pop',
  },
  {
    id: 'DISCARD_CHANGES',
    synonyms: ['descartar cambios', 'descarto mis cambios', 'deshacer cambios de un archivo', 'volver un archivo como estaba'],
    say: 'Usa git restore y el nombre del archivo. Con git restore punto descartas todo. Ojo: no se puede deshacer.',
    cmd: 'git restore ruta/al/archivo\ngit restore .',
  },
  {
    id: 'UNSTAGE',
    synonyms: ['sacar un archivo del stage', 'quitar un archivo del add', 'deshacer un git add', 'quitar archivos preparados'],
    say: 'Usa git restore, guion guion staged, y el nombre del archivo. Lo saca del área de preparación sin perder tus cambios.',
    cmd: 'git restore --staged ruta/al/archivo',
  },
  {
    id: 'AMEND',
    synonyms: ['corregir el último commit', 'cambiar el mensaje del commit', 'agregar algo al último commit', 'editar el último commit'],
    say: 'Usa git commit, guion guion amend. Puedes cambiar el mensaje o agregar archivos que olvidaste. Evítalo si el commit ya está publicado.',
    cmd: 'git add archivo-olvidado\ngit commit --amend',
  },
  {
    id: 'VIEW_HISTORY',
    synonyms: ['ver el historial', 'veo el historial', 'ver los commits', 'ver el log'],
    say: 'Usa git log con las opciones oneline, graph y decorate. Ves cada commit en una línea con el árbol de ramas.',
    cmd: 'git log --oneline --graph --decorate --all',
  },
  {
    id: 'VIEW_CHANGES',
    synonyms: ['ver mis cambios', 'ver las diferencias', 'hacer un diff', 'ver qué cambié'],
    say: 'Usa git diff para ver lo que no has preparado, y git diff, guion guion staged, para ver lo que ya preparaste.',
    cmd: 'git diff\ngit diff --staged',
  },
  {
    id: 'UPDATE_BRANCH',
    synonyms: ['actualizar mi rama', 'actualizo mi rama con main', 'traer los cambios de main', 'sincronizar con main'],
    say: 'Primero git fetch origin. Después git rebase origin main para dejar un historial lineal, o git merge origin main si prefieres no reescribir commits.',
    cmd: 'git fetch origin\ngit rebase origin/main\n# o bien\ngit merge origin/main',
  },
  {
    id: 'RESOLVE_CONFLICTS',
    synonyms: ['resolver conflictos', 'resuelvo un conflicto', 'arreglar un conflicto de merge', 'resolver un merge'],
    say: 'Abre los archivos marcados en git status, elige qué conservar entre las marcas de conflicto, luego git add de cada archivo y termina con git commit, o git rebase guion guion continue si estabas en un rebase.',
    cmd: 'git status\n# edita los archivos en conflicto\ngit add archivo\ngit commit   # o: git rebase --continue',
  },
  {
    id: 'CHERRY_PICK',
    synonyms: ['traer un commit de otra rama', 'hacer cherry pick', 'copiar un commit', 'aplicar un commit específico'],
    say: 'Usa git cherry pick y el hash del commit. Aplica ese commit encima de tu rama actual.',
    cmd: 'git cherry-pick <hash>',
  },
  {
    id: 'SQUASH',
    synonyms: ['juntar commits', 'unir varios commits', 'hacer squash', 'aplastar commits'],
    say: 'Usa git rebase, guion i, HEAD tilde y el número de commits. En el editor cambia pick por squash en los que quieras fusionar.',
    cmd: 'git rebase -i HEAD~3',
  },
  {
    id: 'CREATE_TAG',
    synonyms: ['crear un tag', 'crear una etiqueta', 'marcar una versión', 'hacer un release'],
    say: 'Usa git tag, guion a, el nombre de la versión y un mensaje. Luego súbela con git push origin y el nombre del tag.',
    cmd: 'git tag -a v1.0.0 -m "Versión 1.0.0"\ngit push origin v1.0.0',
  },
  {
    id: 'RECOVER_LOST',
    synonyms: ['recuperar un commit perdido', 'recuperar una rama borrada', 'recupero algo que borré', 'deshacer un reset'],
    say: 'Usa git reflog. Muestra todo lo que ha apuntado HEAD. Busca el hash y crea una rama ahí con git switch guion c.',
    cmd: 'git reflog\ngit switch -c rescate <hash>',
  },
  {
    id: 'FIND_BUG_COMMIT',
    synonyms: ['encontrar qué commit rompió algo', 'buscar el commit con el bug', 'hacer un bisect', 'encontrar dónde se rompió'],
    say: 'Usa git bisect. Empiezas con git bisect start, marcas un commit malo y uno bueno, y Git te hace una búsqueda binaria hasta encontrar el culpable.',
    cmd: 'git bisect start\ngit bisect bad\ngit bisect good <hash-bueno>\n# prueba y marca good/bad hasta terminar\ngit bisect reset',
  },
  {
    id: 'CHANGE_REMOTE',
    synonyms: ['cambiar la url del remoto', 'cambiar el origin', 'cambiar el repositorio remoto'],
    say: 'Usa git remote set url origin y la nueva URL. Verifica con git remote guion v.',
    cmd: 'git remote set-url origin <nueva-url>\ngit remote -v',
  },
  {
    id: 'IGNORE_FILE',
    synonyms: ['ignorar un archivo', 'dejar de rastrear un archivo', 'usar el gitignore'],
    say: 'Agrégalo al archivo punto gitignore. Si ya estaba versionado, quítalo del índice con git rm, guion guion cached.',
    cmd: 'echo "archivo.log" >> .gitignore\ngit rm --cached archivo.log',
  },
];
