# AWS S3 Deploy GitHub Action

### Easily deploy a static website to AWS S3 and invalidate CloudFront distribution

This action is based on the work done by import-io on [s3-deploy](https://github.com/import-io/s3-deploy#readme).

## Usage

You can use this action by referencing the v1 branch

```yaml
uses: lbertenasco/s3-deploy@v1
with:
    folder: build
    bucket: ${{ secrets.S3_BUCKET }}
    dist-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
    invalidation: / *
```

## Arguments

S3 Deploy's Action supports four inputs from the user: `folder`, `bucket`, `dist-id` and `invalidation`. These inputs, along with their descriptions and usage contexts, are listed in the table below:

| Input  | Description | Usage |
| :---:     |     :---:   |    :---:   |
| `folder`  | The folder to upload  | *Required* |
| `bucket`  | The destination bucket | *Required*
| `dist-id`  | The CloudFront Distribution ID to invalidate | *Required*
| `invalidation`  | The CloudFront Distribution path(s) to invalidate | *Required*

### Example `workflow.yml` with S3 Deploy Action

```yaml
name: Example workflow for S3 Deploy
on: [push]
jobs:
  run:
    runs-on: ubuntu-latest
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}
    steps:
        - uses: actions/checkout@v1

        - name: Install dependencies
          run: yarn

        - name: Build
          run: yarn build

        - name: Deploy
          uses: lbertenasco/s3-deploy@v1
          with:
            folder: build
            bucket: ${{ secrets.S3_BUCKET }}
            dist-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
            invalidation: / *
```

## License

The code in this project is released under the [MIT License](LICENSE).
